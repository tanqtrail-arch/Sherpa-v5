/**
 * EconomyAgent - 経済システム管理エージェント
 *
 * 担当:
 * - ALT発行・消費
 * - 証明書発行（上限管理）
 * - マーケットプレイス取引
 * - 残高管理
 */
class EconomyAgent extends BaseAgent {
  constructor() {
    super('EconomyAgent');
    this.certificates = {};
    this.certLimits = {};
  }

  init() {
    super.init();
    this.loadData();

    // ALT獲得イベントを購読
    this.subscribe(Events.ALT_EARNED, this.onAltEarned);
    this.subscribe(Events.MOUNTAIN_CLIMBED, this.onMountainClimbed);
  }

  // データを読み込み
  loadData() {
    this.certificates = this.loadData('sherupa_certs', {});
    this.certLimits = this.loadData('sherupa_certlimits', {});
  }

  // ALT残高を取得
  getBalance() {
    const profile = this.loadData('sherupa_profile', { alt: 0 });
    return profile.alt || 0;
  }

  // ALTを加算
  addAlt(amount, reason = '') {
    const profile = this.loadData('sherupa_profile', { alt: 0 });
    profile.alt = (profile.alt || 0) + amount;
    this.saveData('sherupa_profile', profile);

    console.log(`[EconomyAgent] +${amount} ALT (${reason}), Balance: ${profile.alt}`);

    return {
      amount,
      reason,
      newBalance: profile.alt
    };
  }

  // ALTを減算
  spendAlt(amount, reason = '') {
    const profile = this.loadData('sherupa_profile', { alt: 0 });

    if ((profile.alt || 0) < amount) {
      return {
        success: false,
        error: 'insufficient_balance',
        required: amount,
        available: profile.alt || 0
      };
    }

    profile.alt -= amount;
    this.saveData('sherupa_profile', profile);

    this.emit(Events.ALT_SPENT, { amount, reason });

    console.log(`[EconomyAgent] -${amount} ALT (${reason}), Balance: ${profile.alt}`);

    return {
      success: true,
      amount,
      reason,
      newBalance: profile.alt
    };
  }

  // ALT獲得イベントハンドラ
  onAltEarned({ amount, reason, slideId }) {
    this.addAlt(amount, reason);
  }

  // 登頂イベントハンドラ
  onMountainClimbed({ mountainId, altCost }) {
    const result = this.spendAlt(altCost, `climb_${mountainId}`);
    if (result.success) {
      this.issueCertificate(mountainId);
    }
    return result;
  }

  // 証明書発行上限を取得
  getCertificateLimit(mountainId) {
    const issuedCount = this.getCertificateCount(mountainId);
    const currentLimit = this.certLimits[mountainId] || 20;

    // 80%売れたら拡大
    if (issuedCount >= currentLimit * 0.8 && currentLimit < 100) {
      const newLimit = Math.min(currentLimit + 20, 100);
      this.certLimits[mountainId] = newLimit;
      this.saveData('sherupa_certlimits', this.certLimits);
      return newLimit;
    }

    return currentLimit;
  }

  // 証明書発行枚数を取得
  getCertificateCount(mountainId) {
    return (this.certificates[mountainId] || []).length;
  }

  // 証明書を発行
  issueCertificate(mountainId, ownerId = null, ownerName = null) {
    const limit = this.getCertificateLimit(mountainId);
    const currentCount = this.getCertificateCount(mountainId);

    if (currentCount >= limit) {
      return {
        success: false,
        error: 'limit_reached',
        limit,
        issued: currentCount
      };
    }

    // 所有者情報を取得
    const profile = this.loadData('sherupa_profile', {});
    const userId = ownerId || profile.id || `user_${Date.now()}`;
    const userName = ownerName || profile.name || '探究者さん';

    const certificate = {
      id: `cert_${mountainId}_${Date.now()}`,
      mountainId,
      owner: userId,
      ownerName: userName,
      issuedAt: new Date().toISOString(),
      certNumber: currentCount + 1
    };

    if (!this.certificates[mountainId]) {
      this.certificates[mountainId] = [];
    }
    this.certificates[mountainId].push(certificate);
    this.saveData('sherupa_certs', this.certificates);

    this.emit(Events.CERTIFICATE_ISSUED, {
      certificate,
      mountainId,
      certNumber: certificate.certNumber,
      limit
    });

    console.log(`[EconomyAgent] Certificate issued: ${mountainId} #${certificate.certNumber}/${limit}`);

    return {
      success: true,
      certificate
    };
  }

  // ユーザーの証明書を取得
  getUserCertificates(userId = null) {
    const profile = this.loadData('sherupa_profile', {});
    const targetId = userId || profile.id;

    const userCerts = [];
    for (const [mountainId, certs] of Object.entries(this.certificates)) {
      certs.forEach(cert => {
        if (cert.owner === targetId) {
          userCerts.push(cert);
        }
      });
    }

    return userCerts.sort((a, b) =>
      new Date(b.issuedAt) - new Date(a.issuedAt)
    );
  }

  // 山の証明書一覧を取得
  getMountainCertificates(mountainId) {
    return this.certificates[mountainId] || [];
  }

  // 証明書を売買（マーケットプレイス）
  tradeCertificate(certId, fromUserId, toUserId, price) {
    // 証明書を検索
    let targetCert = null;
    let mountainId = null;

    for (const [mId, certs] of Object.entries(this.certificates)) {
      const cert = certs.find(c => c.id === certId);
      if (cert) {
        targetCert = cert;
        mountainId = mId;
        break;
      }
    }

    if (!targetCert) {
      return { success: false, error: 'certificate_not_found' };
    }

    if (targetCert.owner !== fromUserId) {
      return { success: false, error: 'not_owner' };
    }

    // 購入者の残高確認
    const buyerProfile = this.loadData('sherupa_profile', {});
    if ((buyerProfile.alt || 0) < price) {
      return { success: false, error: 'insufficient_balance' };
    }

    // 取引実行
    targetCert.owner = toUserId;
    targetCert.tradedAt = new Date().toISOString();
    targetCert.lastPrice = price;

    // ALT移動
    this.spendAlt(price, `buy_cert_${certId}`);
    // 売り手へのALT付与は別途処理が必要（マルチユーザー対応時）

    this.saveData('sherupa_certs', this.certificates);

    this.emit(Events.CERTIFICATE_TRADED, {
      certId,
      from: fromUserId,
      to: toUserId,
      price,
      mountainId
    });

    return {
      success: true,
      certificate: targetCert
    };
  }

  // 経済統計
  getEconomyStats() {
    const profile = this.loadData('sherupa_profile', {});
    const userCerts = this.getUserCertificates();

    let totalIssued = 0;
    for (const certs of Object.values(this.certificates)) {
      totalIssued += certs.length;
    }

    return {
      balance: profile.alt || 0,
      certificatesOwned: userCerts.length,
      totalCertificatesIssued: totalIssued,
      mountains: Object.keys(this.certificates).length
    };
  }
}

window.EconomyAgent = EconomyAgent;
